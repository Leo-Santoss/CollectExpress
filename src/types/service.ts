export type ServiceCategory =
  | 'dumpster'
  | 'container'
  | 'residential_collection'
  | 'industrial_collection';

export interface Service {
  id: string;
  title: string;
  description: string;
  price: string;
  location: string;
  imageUrl: string;
  category: ServiceCategory;
  isAvailable: boolean;
}