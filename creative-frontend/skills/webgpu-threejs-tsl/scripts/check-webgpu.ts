/**
 * WebGPU Support Checker
 *
 * Run in browser console or with Bun/Deno to check WebGPU support.
 * For Node.js, use with @aspect-js/webgpu or similar WebGPU polyfill.
 */

interface WebGPUAdapterInfo {
  vendor: string;
  architecture: string;
  device: string;
  description: string;
}

interface WebGPUSupportResult {
  supported: boolean;
  reason?: string;
  adapterInfo?: WebGPUAdapterInfo;
  features?: string[];
  limits?: Record<string, number>;
}

async function checkWebGPUSupport(): Promise<WebGPUSupportResult> {
  // Check if navigator.gpu exists
  if (typeof navigator === "undefined") {
    return {
      supported: false,
      reason: "Running in non-browser environment without navigator",
    };
  }

  if (!navigator.gpu) {
    return {
      supported: false,
      reason: "WebGPU not available (navigator.gpu is undefined)",
    };
  }

  try {
    // Request adapter
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: "high-performance",
    });

    if (!adapter) {
      return {
        supported: false,
        reason: "No WebGPU adapter available",
      };
    }

    // Get adapter info
    const adapterInfo = await adapter.requestAdapterInfo();

    // Get supported features
    const features: string[] = [];
    adapter.features.forEach((feature) => features.push(feature));

    // Get limits
    const limits: Record<string, number> = {};
    const limitKeys = [
      "maxTextureDimension1D",
      "maxTextureDimension2D",
      "maxTextureDimension3D",
      "maxTextureArrayLayers",
      "maxBindGroups",
      "maxBindingsPerBindGroup",
      "maxDynamicUniformBuffersPerPipelineLayout",
      "maxDynamicStorageBuffersPerPipelineLayout",
      "maxSampledTexturesPerShaderStage",
      "maxSamplersPerShaderStage",
      "maxStorageBuffersPerShaderStage",
      "maxStorageTexturesPerShaderStage",
      "maxUniformBuffersPerShaderStage",
      "maxUniformBufferBindingSize",
      "maxStorageBufferBindingSize",
      "maxVertexBuffers",
      "maxBufferSize",
      "maxVertexAttributes",
      "maxVertexBufferArrayStride",
      "maxInterStageShaderComponents",
      "maxComputeWorkgroupStorageSize",
      "maxComputeInvocationsPerWorkgroup",
      "maxComputeWorkgroupSizeX",
      "maxComputeWorkgroupSizeY",
      "maxComputeWorkgroupSizeZ",
      "maxComputeWorkgroupsPerDimension",
    ];

    for (const key of limitKeys) {
      const value = adapter.limits[key as keyof GPUSupportedLimits];
      if (typeof value === "number") {
        limits[key] = value;
      }
    }

    return {
      supported: true,
      adapterInfo: {
        vendor: adapterInfo.vendor || "Unknown",
        architecture: adapterInfo.architecture || "Unknown",
        device: adapterInfo.device || "Unknown",
        description: adapterInfo.description || "Unknown",
      },
      features,
      limits,
    };
  } catch (error) {
    return {
      supported: false,
      reason: `Error requesting adapter: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function formatResult(result: WebGPUSupportResult): string {
  const lines: string[] = [];

  lines.push("╔══════════════════════════════════════════════════════════════╗");
  lines.push("║                    WebGPU Support Check                      ║");
  lines.push("╠══════════════════════════════════════════════════════════════╣");

  if (result.supported) {
    lines.push("║  Status: ✓ SUPPORTED                                         ║");
    lines.push("╠══════════════════════════════════════════════════════════════╣");

    if (result.adapterInfo) {
      lines.push("║  Adapter Info:                                               ║");
      lines.push(`║    Vendor:       ${result.adapterInfo.vendor.padEnd(44)}║`);
      lines.push(`║    Architecture: ${result.adapterInfo.architecture.padEnd(44)}║`);
      lines.push(`║    Device:       ${result.adapterInfo.device.substring(0, 44).padEnd(44)}║`);
    }

    if (result.features && result.features.length > 0) {
      lines.push("╠══════════════════════════════════════════════════════════════╣");
      lines.push("║  Features:                                                   ║");
      for (const feature of result.features.slice(0, 10)) {
        lines.push(`║    • ${feature.padEnd(56)}║`);
      }
      if (result.features.length > 10) {
        lines.push(`║    ... and ${(result.features.length - 10).toString()} more`.padEnd(65) + "║");
      }
    }

    if (result.limits) {
      lines.push("╠══════════════════════════════════════════════════════════════╣");
      lines.push("║  Key Limits:                                                 ║");
      const keyLimits = [
        ["maxTextureDimension2D", result.limits.maxTextureDimension2D],
        ["maxBufferSize", result.limits.maxBufferSize],
        ["maxComputeWorkgroupSizeX", result.limits.maxComputeWorkgroupSizeX],
        ["maxBindGroups", result.limits.maxBindGroups],
      ];
      for (const [name, value] of keyLimits) {
        if (value !== undefined) {
          const formatted = typeof value === "number" ? value.toLocaleString() : String(value);
          lines.push(`║    ${name}: ${formatted}`.padEnd(65) + "║");
        }
      }
    }
  } else {
    lines.push("║  Status: ✗ NOT SUPPORTED                                     ║");
    lines.push("╠══════════════════════════════════════════════════════════════╣");
    lines.push(`║  Reason: ${(result.reason || "Unknown").substring(0, 53).padEnd(53)}║`);
  }

  lines.push("╚══════════════════════════════════════════════════════════════╝");

  return lines.join("\n");
}

// Main execution
async function main() {
  const result = await checkWebGPUSupport();
  console.log(formatResult(result));

  if (!result.supported) {
    console.log("\nTroubleshooting:");
    console.log("1. Use Chrome 113+, Edge 113+, or Safari 18+");
    console.log("2. Enable chrome://flags/#enable-unsafe-webgpu (if needed)");
    console.log("3. Update your GPU drivers");
    console.log("4. WebGPU requires a compatible GPU");
  }

  return result;
}

// Export for module usage
export { checkWebGPUSupport, formatResult, main };
export type { WebGPUSupportResult, WebGPUAdapterInfo };

// Run if executed directly
if (typeof window !== "undefined") {
  main();
}
