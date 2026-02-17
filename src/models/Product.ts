import mongoose, {
  Schema,
  models,
  type InferSchemaType,
} from "mongoose";
import slugify from "slugify";

const slugOptions = { lower: true, strict: true, trim: true };
const toSlug = (value: string) => slugify(value, slugOptions);

const ProductSchema = new Schema(
  {
    name: { type: String, required: true },

    slug: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },

    // Keep existing structure so client doesn't break
    category: { type: String, required: true },
    categorySlug: { type: String },

    brandName: { type: String, default: "" },
    brandSlug: { type: String },

    price: { type: Number, required: true },
    image: { type: String, required: true },
    hoverImage: { type: String },

    description: { type: String },

    isActive: { type: Boolean, default: true },

    stock: { type: Number, default: 0 },
  },
  {
    collection: "products",
    timestamps: true, // 🔥 automatically adds createdAt & updatedAt
  }
);

// 🔥 Indexes for performance
ProductSchema.index({ categorySlug: 1, brandSlug: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ createdAt: -1 });

ProductSchema.pre("save", function (next) {
  if (this.slug) {
    this.slug = toSlug(this.slug);
  }

  if ((!this.slug && this.name) || this.isModified("name")) {
    this.slug = toSlug(this.name);
  }

  if (this.category && (!this.categorySlug || this.isModified("category"))) {
    this.categorySlug = toSlug(this.category);
  }

  if (this.brandName && (!this.brandSlug || this.isModified("brandName"))) {
    this.brandSlug = toSlug(this.brandName);
  }

  next();
});

export type ProductDocument = InferSchemaType<typeof ProductSchema>;

const Product =
  models.Product || mongoose.model("Product", ProductSchema);

export default Product;
