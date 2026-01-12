import { GlifWorkflow } from '../types';

const GLIF_API_URL = 'https://simple-api.glif.app';

export class GlifProvider {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GLIF_API_KEY || '';
  }

  async runWorkflow(workflowId: string, inputs: Record<string, unknown>): Promise<unknown> {
    if (!this.apiKey) {
      throw new Error('GLIF_API_KEY environment variable is required');
    }

    console.log(`[Glif] Running workflow: ${workflowId}`);

    const response = await fetch(GLIF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: workflowId,
        inputs
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Glif API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    console.log(`[Glif] Workflow completed successfully`);
    
    return result;
  }

  async listWorkflows(): Promise<GlifWorkflow[]> {
    console.log('[Glif] Note: Workflow listing requires Glif MCP server');
    return [];
  }
}

export const POPULAR_VIDEO_WORKFLOWS = {
  tiktokVideoWithCaptions: 'cm123...', // Replace with actual workflow IDs
  splitScreenVideo: 'cm456...',
  fastImageVideo: 'cm789...',
  videoWithMusicOverlay: 'cm012...'
};

export async function runGlifWorkflow(
  workflowId: string,
  inputs: Record<string, unknown>
): Promise<unknown> {
  const provider = new GlifProvider();
  return provider.runWorkflow(workflowId, inputs);
}
