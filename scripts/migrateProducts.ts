import mongoose from "mongoose";
import slugify from "slugify";
import Product from "../src/models/Product";
import { connectDB } from "../src/lib/mongoose";

const slugOptions = { lower: true, strict: true, trim: true };
const toSlug = (value: string) => slugify(value, slugOptions);

async function migrateProducts() {
  await connectDB();

  const products = await Product.find().lean<
    Array<{
      _id: mongoose.Types.ObjectId;
      name: string;
      slug?: string;
      category?: string;
      categorySlug?: string;
      brandName?: string;
      brandSlug?: string;
    }>
  >();

  let updatedCount = 0;

  for (const product of products) {
    const updates: Record<string, string> = {};

    if (product.name && !product.slug) {
      updates.slug = toSlug(product.name);
    }

    if (product.category && !product.categorySlug) {
      updates.categorySlug = toSlug(product.category);
    }

    if (product.brandName && !product.brandSlug) {
      updates.brandSlug = toSlug(product.brandName);
    }

    if (Object.keys(updates).length > 0) {
      await Product.updateOne({ _id: product._id }, { $set: updates });
      updatedCount += 1;
    }
  }

  console.log(`✔ Migration complete. Updated ${updatedCount} products.`);
}

migrateProducts()
  .catch((error) => {
    console.error("Product migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
