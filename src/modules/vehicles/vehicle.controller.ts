import { Request, Response } from 'express';
import { vehicleService, VehicleService } from './vehicle.service.js';
import { Vehicle, CreateVehicleBody, UpdateVehicleBody, VehicleQueryFilter } from './vehicle.types.js';
import { ApiSuccess } from '../../common/types/api-response.types.js';

export class VehicleController {
  constructor(private service: VehicleService = vehicleService) {}

  getAll = async (
    req: Request,
    res: Response<ApiSuccess<Vehicle[]>>,
  ): Promise<void> => {
    const filter: VehicleQueryFilter = {
      category: req.query.category as string,
      search: req.query.search as string,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    };
    const result = await this.service.getAllVehicles(filter);
    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  };

  getById = async (
    req: Request,
    res: Response<ApiSuccess<Vehicle>>,
  ): Promise<void> => {
    const id = Number(req.params.id);
    const vehicle = await this.service.getVehicleById(id);
    res.status(200).json({
      success: true,
      data: vehicle,
    });
  };

  create = async (
    req: Request,
    res: Response<ApiSuccess<Vehicle>>,
  ): Promise<void> => {
    const photoPath = req.file ? req.file.path : undefined;
    const body: CreateVehicleBody = {
      name: req.body.name,
      plate_number: req.body.plate_number,
      category: req.body.category,
      daily_rate: Number(req.body.daily_rate),
    };
    const vehicle = await this.service.createVehicle(body, photoPath);
    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: vehicle,
    });
  };

  update = async (
    req: Request,
    res: Response<ApiSuccess<Vehicle>>,
  ): Promise<void> => {
    const id = Number(req.params.id);
    const photoPath = req.file ? req.file.path : undefined;
    const body: UpdateVehicleBody = { ...req.body };
    if (body.daily_rate !== undefined) {
      body.daily_rate = Number(body.daily_rate);
    }
    const vehicle = await this.service.updateVehicle(id, body, photoPath);
    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle,
    });
  };

  delete = async (
    req: Request,
    res: Response<ApiSuccess<null>>,
  ): Promise<void> => {
    const id = Number(req.params.id);
    await this.service.deleteVehicle(id);
    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully',
      data: null,
    });
  };
}

export const vehicleController = new VehicleController();
