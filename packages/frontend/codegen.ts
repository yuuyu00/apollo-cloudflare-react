import type { CodegenConfig } from "@graphql-codegen/cli";
import * as dotenv from "dotenv";

// .env ファイルを読み込む
dotenv.config();

const config: CodegenConfig = {
  overwrite: true,
  schema: process.env.VITE_GRAPHQL_ENDPOINT,
  documents: ["src/**/*.{tsx,ts}"],
  generates: {
    "./src/generated-graphql/": {
      preset: "client",
      presetConfig: {
        gqlTagName: "gql",
      },
      config: {
        useTypeImports: true,
        skipTypename: false,
        dedupeFragments: true,
      },
    },
  },
  ignoreNoDocuments: true,
};

export default config;
