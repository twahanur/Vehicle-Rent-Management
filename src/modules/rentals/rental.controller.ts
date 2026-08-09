import { Request, Response } from 'express';
import { rentalService, RentalService } from './rental.service.js';
import { Rental, CreateRentalBody, UpdateRentalBody, RentalQueryFilter } from './rental.types.js';
import { ApiSuccess } from '../../common/types/api-response.types.js';

export class RentalController {
  constructor(private service: RentalService = rentalService) {}

  getAll = async (
    req: Request,
    res: Response<ApiSuccess<Rental[]>>,
  ): Promise<void> => {
    const filter: RentalQueryFilter = {
      vehicle_id: req.query.vehicle_id ? Number(req.query.vehicle_id) : undefined,
      status: req.query.status as any,
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    };
    const result = await this.service.getAllRentals(filter);
    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  };

  getById = async (
    req: Request,
    res: Response<ApiSuccess<Rental>>,
  ): Promise<void> => {
    const id = Number(req.params.id);
    const rental = await this.service.getRentalById(id);
    res.status(200).json({
      success: true,
      data: rental,
    });
  };

  create = async (
    req: Request,
    res: Response<ApiSuccess<Rental>>,
  ): Promise<void> => {
    const body: CreateRentalBody = {
      vehicle_id: Number(req.body.vehicle_id),
      customer_name: req.body.customer_name,
      customer_phone: req.body.customer_phone,
      start_date: req.body.start_date,
      end_date: req.body.end_date,
    };
    const rental = await this.service.createRental(body);
    res.status(201).json({
      success: true,
      message: 'Rental created successfully',
      data: rental,
    });
  };

  update = async (
    req: Request,
    res: Response<ApiSuccess<Rental>>,
  ): Promise<void> => {
    const id = Number(req.params.id);
    const body: UpdateRentalBody = { ...req.body };
    if (body.vehicle_id !== undefined) {
      body.vehicle_id = Number(body.vehicle_id);
    }
    const rental = await this.service.updateRental(id, body);
    res.status(200).json({
      success: true,
      message: 'Rental updated successfully',
      data: rental,
    });
  };

  delete = async (
    req: Request,
    res: Response<ApiSuccess<null>>,
  ): Promise<void> => {
    const id = Number(req.params.id);
    await this.service.deleteRental(id);
    res.status(200).json({
      success: true,
      message: 'Rental deleted successfully',
      data: null,
    });
  };

  updateStatus = async (
    req: Request,
    res: Response<ApiSuccess<Rental>>,
  ): Promise<void> => {
    const id = Number(req.params.id);
    const { status } = req.body;
    const rental = await this.service.updateRentalStatus(id, status);
    res.status(200).json({
      success: true,
      message: 'Rental status updated successfully',
      data: rental,
    });
  };
}

export const rentalController = new RentalController();
