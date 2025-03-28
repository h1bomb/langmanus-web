import { env } from "~/env";

import { CatchError } from "../exceptions";
import { type Message } from "../messaging";
import { fetchStream } from "../sse";

import { type TeamMember, type ChatEvent } from "./types";

/**
 * ApiService class for handling API-related operations
 */
export class ApiService {
  /**
   * Query team members from the API
   * @returns List of team members
   */
  @CatchError<TeamMember[]>({ fallbackValue: [] })
  static async queryTeamMembers(): Promise<TeamMember[]> {
    const response = await fetch(
      (env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api") +
        "/team_members",
      { method: "GET" },
    );
    const { team_members } = (await response.json()) as {
      team_members: Record<string, TeamMember>;
    };
    const allTeamMembers = Object.values(team_members);
    return [
      ...allTeamMembers.filter((member) => !member.is_optional),
      ...allTeamMembers.filter((member) => member.is_optional),
    ];
  }

  /**
   * Create a chat stream for communication
   * @param userMessage - The user's message
   * @param state - Current state
   * @param params - Parameters for the chat
   * @param options - Additional options
   * @returns A stream of chat events
   */
  @CatchError<AsyncIterable<ChatEvent>>()
  static chatStream(
    userMessage: Message,
    state: { messages: { role: string; content: string }[] },
    params: {
      deepThinkingMode: boolean;
      searchBeforePlanning: boolean;
      teamMembers: string[];
    },
    options: { abortSignal?: AbortSignal } = {},
  ): AsyncIterable<ChatEvent> {
    return fetchStream<ChatEvent>(
      (env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api") + "/chat/stream",
      {
        body: JSON.stringify({
          // TODO: add `thread_id` in the future
          messages: [userMessage],
          deep_thinking_mode: params.deepThinkingMode,
          search_before_planning: params.searchBeforePlanning,
          debug:
            location.search.includes("debug") &&
            !location.search.includes("debug=false"),
          team_members: params.teamMembers,
        }),
        signal: options.abortSignal,
      },
    );
  }
}
