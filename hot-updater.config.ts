import { s3Database, s3Storage } from "@hot-updater/aws";
import { bare } from "@hot-updater/bare";
import { config } from "dotenv";
import { defineConfig } from "hot-updater";

config({ path: ".env.hotupdater" });

const commonOptions = {
    bucketName: process.env.HOT_UPDATER_S3_BUCKET_NAME!,
    region: process.env.HOT_UPDATER_S3_REGION!,
    credentials: {
        accessKeyId: process.env.HOT_UPDATER_S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.HOT_UPDATER_S3_SECRET_ACCESS_KEY!,
    },
};

export default defineConfig({
    build: bare({ enableHermes: true }),
    storage: s3Storage({
        ...commonOptions,
        basePath: process.env.HOT_UPDATER_S3_BUCKET_KEY_PREFIX,
    }),
    database: s3Database({
        ...commonOptions,
        cloudfrontDistributionId: process.env.HOT_UPDATER_CLOUDFRONT_DISTRIBUTION_ID!,
    }),
    updateStrategy: "appVersion", // or "fingerprint"
});
