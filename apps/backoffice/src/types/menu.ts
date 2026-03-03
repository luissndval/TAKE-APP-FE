export interface ProductVariant {
  id: string;
  name: string;
  price_delta: number;
  is_available: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  position: number;
  variants: ProductVariant[];
}

export interface Category {
  id: string;
  name: string;
  position: number;
  products: Product[];
}
