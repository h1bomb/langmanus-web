import { type Message } from "../messaging";

import { ApiService } from "./service";
import { type TeamMember } from "./types";

export function chatStream(
  userMessage: Message,
  state: { messages: { role: string; content: string }[] },
  params: {
    deepThinkingMode: boolean;
    searchBeforePlanning: boolean;
    teamMembers: string[];
  },
  options: { abortSignal?: AbortSignal } = {},
) {
  return ApiService.chatStream(userMessage, state, params, options);
}

// Export the function for backward compatibility
export const queryTeamMembers = (): Promise<TeamMember[]> =>
  ApiService.queryTeamMembers();
