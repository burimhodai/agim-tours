// // Installation required:
// // npm install @nestjs/common @nestjs/core puppeteer
// // npm install -D @types/node

// // src/checkin/checkin.service.ts
// import { Injectable, Logger } from '@nestjs/common';
// import * as puppeteer from 'puppeteer';

// export interface CheckinRequest {
//   bookingNumber: string;
//   lastName: string;
// }

// export interface CheckinResult {
//   success: boolean;
//   message: string;
//   boardingPass?: string;
//   error?: string;
// }

// @Injectable()
// export class CheckinService {
//   private readonly logger = new Logger(CheckinService.name);

//   async performCheckin(request: CheckinRequest): Promise<CheckinResult> {
//     let browser: puppeteer.Browser | null = null;

//     try {
//       this.logger.log(`Starting check-in for booking: ${request.bookingNumber}`);

//       // Launch browser
//       browser = await puppeteer.launch({
//         headless: false, // Set to true for production
//         args: ['--no-sandbox', '--disable-setuid-sandbox'],
//       });

//       const page = await browser.newPage();
      
//       // Set viewport and user agent
//       await page.setViewport({ width: 1280, height: 800 });
//       await page.setUserAgent(
//         'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
//       );

//       // Navigate to Wizz Air check-in page
//       this.logger.log('Navigating to check-in page...');
//       await page.goto('https://wizzair.com/en-gb/online-check-in', {
//         waitUntil: 'networkidle2',
//         timeout: 30000,
//       });

//       // Wait for and accept cookies if present
//       try {
//         await page.waitForSelector('button[data-test="cookie-accept"]', { timeout: 5000 });
//         await page.click('button[data-test="cookie-accept"]');
//         this.logger.log('Accepted cookies');
//       } catch (e) {
//         this.logger.log('No cookie banner found or already accepted');
//       }

//       // Wait for booking number input field
//       this.logger.log('Looking for booking number field...');
//       await page.waitForSelector('input[name="bookingNumber"]', { timeout: 10000 });

//       // Fill in booking number
//       await page.type('input[name="bookingNumber"]', request.bookingNumber, {
//         delay: 100,
//       });

//       // Fill in last name
//       await page.type('input[name="lastName"]', request.lastName, {
//         delay: 100,
//       });

//       this.logger.log('Filled in booking details');

//       // Click check-in button
//       await page.click('button[type="submit"]');
//       this.logger.log('Submitted check-in form');

//       // Wait for navigation
//       await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

//       // Check for errors
//       const errorElement = await page.$('.error-message, .alert-danger');
//       if (errorElement) {
//         const errorText = await page.evaluate(el => el.textContent, errorElement);
//         throw new Error(`Check-in failed: ${errorText}`);
//       }

//       // Wait for passenger selection or confirmation
//       await page.waitForTimeout(2000);

//       // Try to select all passengers and continue
//       const selectAllButton = await page.$('button[data-test="select-all-passengers"]');
//       if (selectAllButton) {
//         await selectAllButton.click();
//         this.logger.log('Selected all passengers');
//       }

//       // Look for continue/confirm button
//       const continueButton = await page.$('button[data-test="continue"], button:has-text("Continue")');
//       if (continueButton) {
//         await continueButton.click();
//         await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
//       }

//       // Try to skip seat selection (if prompted)
//       try {
//         const skipSeatsButton = await page.$('button:has-text("Skip"), button[data-test="skip-seats"]');
//         if (skipSeatsButton) {
//           await skipSeatsButton.click();
//           this.logger.log('Skipped seat selection');
//           await page.waitForTimeout(2000);
//         }
//       } catch (e) {
//         this.logger.log('No seat selection skip needed');
//       }

//       // Check if we reached the boarding pass page
//       const boardingPassElement = await page.$('.boarding-pass, [data-test="boarding-pass"]');
      
//       if (boardingPassElement) {
//         this.logger.log('Check-in successful!');
        
//         // Optionally take a screenshot of the boarding pass
//         const screenshot = await page.screenshot({ 
//           encoding: 'base64',
//           fullPage: true 
//         });

//         return {
//           success: true,
//           message: 'Check-in completed successfully',
//           boardingPass: screenshot,
//         };
//       }

//       return {
//         success: true,
//         message: 'Check-in process completed, but boarding pass not confirmed',
//       };

//     } catch (error) {
//       this.logger.error('Check-in failed', error);
//       return {
//         success: false,
//         message: 'Check-in failed',
//         error: error.message,
//       };
//     } finally {
//       if (browser) {
//         await browser.close();
//       }
//     }
//   }
// }

// // src/checkin/checkin.controller.ts
// import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
// import { CheckinService, CheckinRequest, CheckinResult } from './checkin.service';

// @Controller('checkin')
// export class CheckinController {
//   constructor(private readonly checkinService: CheckinService) {}

//   @Post()
//   @HttpCode(HttpStatus.OK)
//   async checkin(@Body() request: CheckinRequest): Promise<CheckinResult> {
//     return this.checkinService.performCheckin(request);
//   }
// }

// // src/checkin/checkin.module.ts
// import { Module } from '@nestjs/common';
// import { CheckinController } from './checkin.controller';
// import { CheckinService } from './checkin.service';

// @Module({
//   controllers: [CheckinController],
//   providers: [CheckinService],
//   exports: [CheckinService],
// })
// export class CheckinModule {}

// // src/app.module.ts
// import { Module } from '@nestjs/common';
// import { CheckinModule } from './checkin/checkin.module';

// @Module({
//   imports: [CheckinModule],
// })
// export class AppModule {}

// // src/main.ts
// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   app.enableCors();
//   await app.listen(3000);
//   console.log('Check-in bot running on http://localhost:3000');
// }
// bootstrap();

// // Example usage via HTTP request:
// /*
// POST http://localhost:3000/checkin
// Content-Type: application/json

// {
//   "bookingNumber": "ABC123",
//   "lastName": "Smith"
// }
// */