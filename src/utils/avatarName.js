export default function extractImageName(url) {
  // Decode the URL to handle encoded characters
  const decodedUrl = decodeURIComponent(url);

  // Define the relevant portion of the path
  const relevantPath = 'avatars/L1/';

  // Check if the decoded URL includes the relevant portion
  const startIndex = decodedUrl.indexOf(relevantPath);
  if (startIndex !== -1) {
    // Extract the portion of the path that comes after the relevant portion
    const imagePath = decodedUrl.substring(startIndex + relevantPath.length);

    // Split the imagePath by '?' to separate the image name from query parameters
    const imageName = imagePath.split('?')[0];

    // Return the image name if it exists
    return imageName;
  }

  // If the relevant portion is not found, return null
  return null;
}
