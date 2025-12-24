import { Model, UpdateQuery, QueryOptions } from 'mongoose';
import { BaseSchema } from './schemas/base.schema';

export abstract class BaseRepository<T extends BaseSchema> {
  constructor(protected readonly model: Model<T>) {}

  /**
   * Create a new document
   */
  async create(data: Partial<T>): Promise<T> {
    const document = new this.model(data);
    return document.save();
  }

  /**
   * Find one document (excluding soft-deleted)
   */
  async findOne(filter: Record<string, any>): Promise<T | null> {
    return this.model
      .findOne({ ...filter, isDeleted: false })
      .exec();
  }

  /**
   * Find by ID (excluding soft-deleted)
   */
  async findById(id: string): Promise<T | null> {
    return this.model
      .findOne({ _id: id, isDeleted: false })
      .exec();
  }

  /**
   * Find all documents (excluding soft-deleted)
   */
  async findAll(
    filter: Record<string, any> = {},
    options: QueryOptions = {},
  ): Promise<T[]> {
    return this.model
      .find({ ...filter, isDeleted: false }, null, options)
      .exec();
  }

  /**
   * Update one document
   */
  async updateOne(
    filter: Record<string, any>,
    update: UpdateQuery<T>,
  ): Promise<T | null> {
    return this.model
      .findOneAndUpdate(
        { ...filter, isDeleted: false },
        update,
        { new: true },
      )
      .exec();
  }

  /**
   * Update by ID
   */
  async updateById(id: string, update: UpdateQuery<T>): Promise<T | null> {
    return this.model
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        update,
        { new: true },
      )
      .exec();
  }

  /**
   * Soft delete a document
   */
  async softDelete(id: string): Promise<T | null> {
    return this.model
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true, deletedAt: new Date() } as UpdateQuery<T>,
        { new: true },
      )
      .exec();
  }

  /**
   * Count documents (excluding soft-deleted)
   */
  async count(filter: Record<string, any> = {}): Promise<number> {
    return this.model
      .countDocuments({ ...filter, isDeleted: false })
      .exec();
  }

  /**
   * Check if document exists (excluding soft-deleted)
   */
  async exists(filter: Record<string, any>): Promise<boolean> {
    const count = await this.model
      .countDocuments({ ...filter, isDeleted: false })
      .limit(1)
      .exec();
    return count > 0;
  }
}