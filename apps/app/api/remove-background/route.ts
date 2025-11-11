import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { promisify } from 'util';

const execPromise = promisify(exec);

export const maxDuration = 30;

/**
 * POST /api/remove-background
 * Accepts a form-data request with an image file and returns the processed image
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(buffer);

    // Create temporary files
    const tempDir = tmpdir();
    const inputPath = join(tempDir, `input-${Date.now()}.png`);
    const outputPath = join(tempDir, `output-${Date.now()}.png`);

    try {
      // Write input image
      writeFileSync(inputPath, imageBuffer);

      // Use Python script to process with rembg
      const pythonScript = `
from PIL import Image
from rembg import remove

input_path = "${inputPath}"
output_path = "${outputPath}"

try:
    # Open the image
    input_image = Image.open(input_path)

    # Remove background
    output_image = remove(input_image)

    # Save the result
    output_image.save(output_path, 'PNG')
    print("Success")
except Exception as e:
    print(f"Error: {e}")
    exit(1)
`;

      const command = `python3 -c "${pythonScript.replace(/"/g, '\\"')}"`;
      console.log('Running background removal...');

      const { stderr } = await execPromise(command, {
        timeout: 60000, // 60 second timeout
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer
      });

      if (stderr) {
        console.warn('stderr:', stderr);
      }

      // Read output image
      const resultBuffer = readFileSync(outputPath);

      // Clean up
      unlinkSync(inputPath);
      unlinkSync(outputPath);

      // Return the processed image
      return new NextResponse(resultBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Content-Length': resultBuffer.length.toString(),
        },
      });
    } catch (error) {
      // Clean up on error
      try {
        unlinkSync(inputPath);
      } catch {
        // File might not exist
      }
      try {
        unlinkSync(outputPath);
      } catch {
        // File might not exist
      }

      console.error('Background removal error:', error);
      throw error;
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to process image',
      },
      { status: 500 }
    );
  }
}
