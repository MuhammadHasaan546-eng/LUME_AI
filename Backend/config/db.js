import mongoose from "mongoose";

async function main() {
  await mongoose.connect(process.env.MONGODB_URL).then(() => {
    console.log("Database connected successfully");
  });
}
main().catch((err) => console.log(err));

export default main;
