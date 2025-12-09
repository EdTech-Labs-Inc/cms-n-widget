import * as https from "https";

export const handler = async (_event: any) => {
  const binUrl = process.env.BIN_URL;
  if (!binUrl) {
    throw new Error("BIN_URL env var is not set");
  }

  console.log("Calling BIN_URL:", binUrl);

  // Simple GET request is enough – RequestBin/webhook.site will log it.
  const responseBody = await new Promise<string>((resolve, reject) => {
    https
      .get(binUrl, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          resolve(data);
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });

  console.log("Response from bin:", responseBody.slice(0, 200)); // just for sanity

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Request sent to bin" }),
  };
};
