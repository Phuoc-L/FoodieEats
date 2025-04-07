
require("dotenv").config({ path: "secrets.ini" });
const AWS = require("aws-sdk");
require("aws-sdk/lib/maintenance_mode_message").suppress = true;

// Configure AWS with your access and secret key.
AWS.config.update({
  region: process.env.REGION,
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_KEY
});

const s3 = new AWS.S3();

// function to get presigned url from s3
async function getPresignedURL(fileName, fileType, uploadDir)
{
  const s3Params = {
    Bucket: process.env.BUCKET_NAME,
    Key: `${uploadDir}/${fileName}`,
    Expires: 60, // seconds
    ContentType: fileType
    // ACL: 'public-read' // Removed: Bucket does not support ACLs
  };

  try {
    const url = await s3.getSignedUrlPromise("putObject", s3Params);
    return url;
  } catch (error) {
    return { error: "Error generating pre-signed URL" };
  }
};

module.exports = getPresignedURL;
