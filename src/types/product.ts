export interface ProductNutrientDTO {
  name?: string;
  amount?: string;
  dailyValue?: string;
  indentLevel?: number;
  emphasized?: boolean;
}

export interface ProductServingInfoDTO {
  title?: string;
  servingSize?: string;
  servingsPerContainer?: number;
  amountPerServingLabel?: string;
  dailyValueLabel?: string;
  footnote?: string;
  ingredientsText?: string;
  containsText?: string;
  noticeText?: string;
  nutrients?: ProductNutrientDTO[];
}

export interface ProductDetailsDTO {
  overview?: string;
  ingredients?: string[];
  benefits?: string[];
  howToUse?: string[];
  warnings?: string[];
  additionalInfo?: string[];
  servingInfo?: ProductServingInfoDTO;
}

export interface ProductCoaDTO {
  certificateUrl?: string;
  verified?: boolean;
}

export interface ProductDTO {
  _id: string;
  name: string;
  slug: string;
  category: string;
  categorySlug?: string;
  brandName?: string;
  brandSlug?: string;
  price: number;
  discountPrice?: number;
  currency?: string;
  image: string;
  hoverImage?: string;
  gallery?: string[];
  description?: string;
  details?: ProductDetailsDTO;
  coa?: ProductCoaDTO;
  isActive?: boolean;
  stock: number;
}
