import express from "express";
import { OpenFeature } from "@openfeature/server-sdk";
import { MyProvider } from "./provider";
import { FeatureFlag } from "./flags";

const provider = new MyProvider(
  {
    [FeatureFlag.WELCOME_MESSAGE]: {
      variants: {
        default: false,
        on: true,
      },
      defaultVariant: "default",
      disabled: false,
    },
  },
  {
    [FeatureFlag.WELCOME_MESSAGE]: "default",
  },
);
OpenFeature.setProvider(provider);
const client = OpenFeature.getClient();

const app = express();
const port = 3000;

app.get("/", async (req, res) => {
  const feature = await client.getBooleanValue("welcome-message", false, {
    "x-feature-flags": req.headers["x-feature-flags"] || "",
  });
  console.log("Feature Flag: ", feature);
  const message = feature ? "Hello World + OpenFeature!" : "Hello World!";
  res.send(message);
});

app.listen(port, () => {
  console.log("Server is running at %d", port);
});
