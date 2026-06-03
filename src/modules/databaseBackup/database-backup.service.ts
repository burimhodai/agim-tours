import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import {
  AnyBulkWriteOperation,
  Collection,
  Db,
  Document,
  Filter,
  IndexDescription,
  IndexDescriptionInfo,
  MongoClient,
} from 'mongodb';
import { Connection } from 'mongoose';
import { DateTime } from 'luxon';

const BACKUP_BATCH_SIZE = 1000;
const BACKUP_TIME_ZONE = 'Europe/Skopje';
const BACKUP_METADATA_COLLECTION = '__backup_metadata';

interface BackupMetadataDocument extends Document {
  _id: string;
  sourceDatabase: string;
  backupDatabase: string;
  lastSuccessfulRunAt: Date;
  lastStartedAt: Date;
  totalDocuments: number;
}

type SourceCollectionReader = Pick<
  Collection<Document>,
  'collectionName' | 'find' | 'listIndexes'
>;

@Injectable()
export class DatabaseBackupService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseBackupService.name);
  private backupClient?: MongoClient;
  private running = false;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly configService: ConfigService,
  ) {}

  @Cron('0 22 * * *', {
    name: 'daily-database-backup',
    timeZone: BACKUP_TIME_ZONE,
  })
  async backupMainDatabase(): Promise<void> {
    await this.syncMainDatabaseToBackup();
  }

  async onModuleDestroy(): Promise<void> {
    await this.backupClient?.close();
  }

  private async syncMainDatabaseToBackup(): Promise<void> {
    if (this.running) {
      this.logger.warn(
        'Database backup skipped because a previous run is still active',
      );
      return;
    }

    this.running = true;

    try {
      const sourceDb = this.connection.db;

      if (!sourceDb) {
        throw new Error('MongoDB source database is not available');
      }

      const backupDb = await this.getBackupDatabase(sourceDb);
      const collections = await sourceDb
        .listCollections({}, { nameOnly: true })
        .toArray();
      const startedAt = new Date();
      const createdFrom = DateTime.now()
        .setZone(BACKUP_TIME_ZONE)
        .startOf('day')
        .toJSDate();
      let totalDocuments = 0;

      for (const collectionInfo of collections) {
        if (this.shouldSkipCollection(collectionInfo.name)) {
          continue;
        }

        const sourceCollection = this.getSourceCollectionReader(
          sourceDb,
          collectionInfo.name,
        );
        const backupCollection = backupDb.collection(collectionInfo.name);

        await this.syncCollectionIndexes(sourceCollection, backupCollection);

        const copied = await this.upsertCollectionDocuments(
          sourceCollection,
          backupCollection,
          createdFrom,
          startedAt,
        );

        totalDocuments += copied;

        this.logger.log(
          `Synced ${copied} documents from ${collectionInfo.name}`,
        );
      }

      await backupDb
        .collection<BackupMetadataDocument>(BACKUP_METADATA_COLLECTION)
        .updateOne(
          { _id: 'daily-main-db-sync' },
          {
            $set: {
              sourceDatabase: sourceDb.databaseName,
              backupDatabase: backupDb.databaseName,
              lastSuccessfulRunAt: startedAt,
              lastStartedAt: startedAt,
              copiedCreatedFrom: createdFrom,
              copiedCreatedTo: startedAt,
              totalDocuments,
            },
          },
          { upsert: true },
        );

      this.logger.log(
        `Daily database backup finished. Synced ${totalDocuments} documents created today from ${sourceDb.databaseName} to ${backupDb.databaseName}`,
      );
    } catch (error) {
      this.logger.error(
        error instanceof Error ? error.message : 'Daily database backup failed',
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.running = false;
    }
  }

  private async upsertCollectionDocuments(
    sourceCollection: SourceCollectionReader,
    backupCollection: Collection<Document>,
    createdFrom: Date,
    createdTo: Date,
  ): Promise<number> {
    const filter = this.getCreatedTodayFilter(createdFrom, createdTo);
    const cursor = sourceCollection
      .find(filter)
      .sort({ _id: 1 })
      .batchSize(BACKUP_BATCH_SIZE);

    let copied = 0;
    let operations: AnyBulkWriteOperation<Document>[] = [];

    for await (const document of cursor) {
      operations.push({
        replaceOne: {
          filter: { _id: document._id },
          replacement: document,
          upsert: true,
        },
      });

      if (operations.length >= BACKUP_BATCH_SIZE) {
        await backupCollection.bulkWrite(operations, { ordered: false });
        copied += operations.length;
        operations = [];
      }
    }

    if (operations.length > 0) {
      await backupCollection.bulkWrite(operations, { ordered: false });
      copied += operations.length;
    }

    return copied;
  }

  private getCreatedTodayFilter(
    createdFrom: Date,
    createdTo: Date,
  ): Filter<Document> {
    return {
      createdAt: { $gte: createdFrom, $lte: createdTo },
    };
  }

  private async syncCollectionIndexes(
    sourceCollection: SourceCollectionReader,
    backupCollection: Collection<Document>,
  ): Promise<void> {
    const indexes = (await sourceCollection
      .listIndexes()
      .toArray()) as IndexDescriptionInfo[];
    const indexesToCreate: IndexDescription[] = indexes
      .filter((index) => index.name !== '_id_')
      .map((index) => ({
        key: index.key,
        name: index.name,
        background: index.background,
        unique: index.unique,
        partialFilterExpression: index.partialFilterExpression,
        sparse: index.sparse,
        hidden: index.hidden,
        expireAfterSeconds: index.expireAfterSeconds,
        storageEngine: index.storageEngine,
        version: index.v,
        weights: index.weights,
        default_language: index.default_language,
        language_override: index.language_override,
        textIndexVersion: index.textIndexVersion,
        '2dsphereIndexVersion': index['2dsphereIndexVersion'],
        bits: index.bits,
        min: index.min,
        max: index.max,
        bucketSize: index.bucketSize,
        wildcardProjection: index.wildcardProjection,
        collation: index.collation,
      }));

    if (indexesToCreate.length === 0) {
      return;
    }

    try {
      await backupCollection.createIndexes(indexesToCreate);
    } catch (error) {
      this.logger.warn(
        `Could not sync indexes for ${sourceCollection.collectionName}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  private async getBackupDatabase(sourceDb: Db): Promise<Db> {
    const backupUri =
      this.configService.get<string>('BACKUP_DATABASE_URL') ??
      this.configService.get<string>('DATABASE_BACKUP_URL');

    if (!backupUri) {
      throw new Error('BACKUP_DATABASE_URL must be configured');
    }

    if (!this.backupClient) {
      this.backupClient = new MongoClient(backupUri);
      await this.backupClient.connect();
    }

    const backupDbName =
      this.configService.get<string>('BACKUP_DATABASE_NAME') ??
      this.configService.get<string>('DATABASE_BACKUP_NAME');

    if (backupDbName) {
      if (backupDbName === sourceDb.databaseName) {
        throw new Error(
          'BACKUP_DATABASE_NAME must be different from the main database name',
        );
      }

      return this.backupClient.db(backupDbName);
    }

    const backupDb = this.backupClient.db();

    if (backupDb.databaseName === sourceDb.databaseName) {
      throw new Error(
        'The database in BACKUP_DATABASE_URL must be different from the main database',
      );
    }

    return backupDb;
  }

  private getSourceCollectionReader(
    sourceDb: Db,
    collectionName: string,
  ): SourceCollectionReader {
    return sourceDb.collection(collectionName);
  }

  private shouldSkipCollection(collectionName: string): boolean {
    return (
      collectionName.startsWith('system.') ||
      collectionName === BACKUP_METADATA_COLLECTION
    );
  }
}
