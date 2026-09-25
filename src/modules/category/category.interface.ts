import { Document } from 'mongoose';

export interface ICategory {
  name: string;
  description: string;
  active: boolean;
}

export interface ICategoryDoc extends ICategory, Document {}
