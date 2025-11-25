export interface ProductDTO {
  _id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  image: string;
  hoverImage?: string;
  description?: string;
}
