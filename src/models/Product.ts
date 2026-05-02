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

    // ✅ Category
    category: { type: String, required: true },
    categorySlug: { type: String },

    // ✅ Brand
    brandName: { type: String, default: "" },
    brandSlug: { type: String },

    // ✅ Pricing
    price: { type: Number, required: true },

    // 🔥 (Future ready for Sri Lanka)
    discountPrice: { type: Number },
    currency: { type: String, default: "LKR" },

    // ✅ Images
    image: { type: String, required: true },
    hoverImage: { type: String },
    gallery: [{ type: String }], // multiple images

    // ✅ Legacy (DO NOT REMOVE — avoids breaking frontend)
    description: { type: String },

    // 🔥 NEW — Structured product content
    details: {
      overview: { type: String },

      ingredients: [{ type: String }],
      benefits: [{ type: String }],
      howToUse: [{ type: String }],
      warnings: [{ type: String }],
      additionalInfo: [{ type: String }],

      servingInfo: {
        servingSize: { type: String },
        servingsPerContainer: { type: Number },

        nutrients: [
          {
            name: { type: String },
            amount: { type: String },
            dailyValue: { type: String },
            indentLevel: { type: Number, default: 0 },
            emphasized: { type: Boolean, default: false },
          },
        ],
        title: { type: String, default: "Nutrition Facts" },
        amountPerServingLabel: {
          type: String,
          default: "Amount Per Serving",
        },
        dailyValueLabel: { type: String, default: "% Daily Value" },
        footnote: { type: String },
        ingredientsText: { type: String },
        containsText: { type: String },
        noticeText: { type: String },
      },
    },

    // 🔥 Authenticity (BIG for your project)
    coa: {
      certificateUrl: { type: String },
      verified: { type: Boolean, default: false },
    },

    // ✅ Status & Inventory
    isActive: { type: Boolean, default: true },
    stock: { type: Number, default: 0 },
  },
  {
    collection: "products",
    timestamps: true,
    minimize: false,
  }
);

// 🔥 Indexes (important for filtering & performance)
ProductSchema.index({ categorySlug: 1, brandSlug: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ "details.servingInfo.nutrients.name": 1 });

// 🔥 Auto-generate slugs
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
