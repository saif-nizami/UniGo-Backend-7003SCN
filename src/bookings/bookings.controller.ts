import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  ParseIntPipe,
  BadRequestException,
  Res,
  UseGuards
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-bookings.dto';
import { RateBookingDto } from './dto/rate-bookings.dto';
import type { Response } from 'express';
import PDFDocument from 'pdfkit';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // POST /api/trips/:tripId/bookings
  @Post('trips/:tripId/bookings')
  async createBooking(
    @Param('tripId', ParseIntPipe) tripId: number,
    @Body() body: CreateBookingDto,
  ) {
    if (!body.user_id) throw new BadRequestException('user_id is required');
    return this.bookingsService.createBooking(tripId, body);
  }

  // GET /api/bookings/:bookingId
  @Get(':bookingId')
  async getBooking(@Param('bookingId', ParseIntPipe) bookingId: number) {
    return this.bookingsService.getBookingById(bookingId);
  }

  // POST /api/bookings/:bookingId/cancel
  @Post(':bookingId/cancel')
  async cancelBooking(
    @Param('bookingId', ParseIntPipe) bookingId: number,
    @Body('user_id') user_id: number,
  ) {
    return this.bookingsService.cancelBooking(bookingId, user_id);
  }

  // POST /api/bookings/:bookingId/rate
  @Post(':bookingId/rate')
  async rateBooking(
    @Param('bookingId', ParseIntPipe) bookingId: number,
    @Body() body: RateBookingDto,
  ) {
    return this.bookingsService.rateBooking(
      bookingId,
      body.rating,
      body.comment,
    );
  }

  // GET /api/bookings/:bookingId/receipt?format=pdf|json
  @Get(':bookingId/receipt')
  async getReceipt(
    @Param('bookingId', ParseIntPipe) bookingId: number,
    @Res() res: Response,
    @Body() body: any,
  ) {
    const receipt = await this.bookingsService.getReceipt(bookingId);

    // If query wants PDF, generate simple PDF
    // Note: Using pdfkit; ensure it is installed in your project (npm i pdfkit @types/pdfkit)
    const format = (body && body.format) || 'json';

    if (format === 'pdf') {
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=receipt_${bookingId}.pdf`,
      );
      doc.text('Booking Receipt', { align: 'center' });
      doc.moveDown();
      doc.text(JSON.stringify(receipt, null, 2));
      doc.end();
      doc.pipe(res);
      return;
    }

    return res.json(receipt);
  }
}