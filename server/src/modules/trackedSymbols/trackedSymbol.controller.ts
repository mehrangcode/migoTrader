import { NextFunction, Request, Response } from "express";
import { ITrackedSymbolRepository } from "../../domain/repositories/ITrackedSymbolRepository";
import {
  createTimeframeConfigSchema,
  createTrackedSymbolSchema,
  updateTimeframeConfigSchema,
  updateTrackedSymbolSchema,
} from "./trackedSymbol.dto";

export class TrackedSymbolController {
  constructor(private readonly repo: ITrackedSymbolRepository) {}

  list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json(await this.repo.findAll());
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parsed = createTrackedSymbolSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    try {
      res.status(201).json(await this.repo.create(parsed.data));
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parsed = updateTrackedSymbolSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    try {
      res.json(await this.repo.update(req.params.id, parsed.data));
    } catch (err) {
      next(err);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.repo.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  addTimeframe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parsed = createTimeframeConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    try {
      const config = await this.repo.addTimeframeConfig({
        trackedSymbolId: req.params.id,
        ...parsed.data,
      });
      res.status(201).json(config);
    } catch (err) {
      next(err);
    }
  };

  updateTimeframe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parsed = updateTimeframeConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    try {
      res.json(await this.repo.updateTimeframeConfig(req.params.timeframeId, parsed.data));
    } catch (err) {
      next(err);
    }
  };

  removeTimeframe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.repo.deleteTimeframeConfig(req.params.timeframeId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
