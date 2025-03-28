import { useEffect } from "react";
import { create } from "zustand";

import {
  CatchError,
  ExceptionHandler,
  NetworkException,
  UnexpectedException,
} from "~/core/exceptions";

import {
  type ChatEvent,
} from "../api";
import { chatStream as mockChatStream } from "../api/mock";
import { ApiService } from "../api/service";
import {
  type WorkflowMessage,
  type Message,
  type TextMessage,
  type ErrorMessage,
} from "../messaging";
import { clone } from "../utils";
import { WorkflowEngine } from "../workflow";

export const useStore = create<{
  teamMembers: TeamMember[];
  enabledTeamMembers: string[];
  messages: Message[];
  responding: boolean;
  state: {
    messages: { role: string; content: string }[];
  };
}>(() => ({
  teamMembers: [],
  enabledTeamMembers: [],
  messages: [],
  responding: false,
  state: {
    messages: [],
  },
}));

// 从 API 导入 TeamMember 类型
export interface TeamMember {
  name: string;
  is_optional: boolean;
  [key: string]: any;
}

export function useInitTeamMembers() {
  useEffect(() => {
    const enabledTeamMembers = localStorage.getItem(
      "langmanus.config.enabledTeamMembers",
    );
    void ApiService.queryTeamMembers().then((teamMembers: TeamMember[]) => {
      useStore.setState({
        teamMembers,
        enabledTeamMembers: enabledTeamMembers
          ? JSON.parse(enabledTeamMembers)
          : teamMembers.map((member: TeamMember) => member.name),
      });
    });
  }, []);
}

export function setEnabledTeamMembers(enabledTeamMembers: string[]) {
  useStore.setState({ enabledTeamMembers });
  localStorage.setItem(
    "langmanus.config.enabledTeamMembers",
    JSON.stringify(enabledTeamMembers),
  );
}

export function addMessage(message: Message) {
  useStore.setState((state) => ({ messages: [...state.messages, message] }));
  return message;
}

export function updateMessage(message: Partial<Message> & { id: string }) {
  useStore.setState((state) => {
    const index = state.messages.findIndex((m) => m.id === message.id);
    if (index === -1) {
      return state;
    }
    const newMessage = clone({
      ...state.messages[index],
      ...message,
    } as Message);
    return {
      messages: [
        ...state.messages.slice(0, index),
        newMessage,
        ...state.messages.slice(index + 1),
      ],
    };
  });
}

export function clearMessages() {
  useStore.setState({ messages: [] });
}

export function setResponding(responding: boolean) {
  useStore.setState({ responding });
}

export function setWorkflowFinalState(state: {
  messages: { role: string; content: string }[];
}) {
  useStore.setState({ state });
}

// MessageService class to handle complex message operations
export class MessageService {
  /**
   * Create error message
   */
  static createErrorMessage(e: unknown, originalMessage?: Message): ErrorMessage {
    const errorId = `error-${Date.now()}`;
    let errorTitle = "Failed to send message";
    let errorDescription = "Please check your network connection and try again";

    // Customize error message based on exception type
    if (e instanceof NetworkException) {
      errorTitle = "Network Connection Error";
      errorDescription = e.message;
    } else if (e instanceof Error) {
      errorDescription = e.message || errorDescription;
    }

    // Create error message
    const errorMessage: ErrorMessage = {
      id: errorId,
      role: "assistant",
      type: "error",
      content: {
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      },
    };

    // Use ExceptionHandler to handle exceptions
    if (e instanceof NetworkException || e instanceof Error) {
      ExceptionHandler.handle(e);
    } else {
      // Unknown error, wrap as UnexpectedException
      ExceptionHandler.handle(
        new UnexpectedException(
          "Failed to send message, please check your network connection",
          {
            cause: e instanceof Error ? e : undefined,
            metadata: { message: originalMessage },
          },
        ),
      );
    }

    return errorMessage;
  }

  /**
   * Send message and handle response
   */
  @CatchError<Message>()
  static async sendMessage(
    message: Message,
    params: {
      deepThinkingMode: boolean;
      searchBeforePlanning: boolean;
    },
    options: { abortSignal?: AbortSignal } = {},
  ): Promise<Message> {
    addMessage(message);
    let stream: AsyncIterable<ChatEvent>;
    if (window.location.search.includes("mock")) {
      stream = mockChatStream(message);
    } else {
      stream = ApiService.chatStream(
        message,
        useStore.getState().state,
        {
          ...params,
          teamMembers: useStore.getState().enabledTeamMembers,
        },
        options,
      );
    }
    setResponding(true);

    let textMessage: TextMessage | null = null;
    try {
      for await (const event of stream) {
        switch (event.type) {
          case "start_of_agent":
            textMessage = {
              id: event.data.agent_id,
              role: "assistant",
              type: "text",
              content: "",
            };
            addMessage(textMessage);
            break;
          case "final_session_state":
            setWorkflowFinalState({
              messages: event.data.messages,
            });
            break;
          case "message":
            if (textMessage) {
              textMessage.content += event.data.delta.content;
              updateMessage({
                id: textMessage.id,
                content: textMessage.content,
              });
            }
            break;
          case "end_of_agent":
            textMessage = null;
            break;
          case "start_of_workflow":
            const workflowEngine = new WorkflowEngine();
            const workflow = workflowEngine.start(event);
            const workflowMessage: WorkflowMessage = {
              id: event.data.workflow_id,
              role: "assistant",
              type: "workflow",
              content: { workflow: workflow },
            };
            addMessage(workflowMessage);
            for await (const updatedWorkflow of workflowEngine.run(stream)) {
              updateMessage({
                id: workflowMessage.id,
                content: { workflow: updatedWorkflow },
              });
            }
            setWorkflowFinalState({
              messages: workflow.finalState?.messages ?? [],
            });
            break;
          default:
            break;
        }
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return message;
      }

      // Create error message object
      const errorMessage = MessageService.createErrorMessage(e, message);
      addMessage(errorMessage);

      // Do not rethrow exceptions, let exception handler process it completely
    } finally {
      setResponding(false);
    }
    return message;
  }
}

// Export sendMessage function for backward compatibility
export async function sendMessage(
  message: Message,
  params: {
    deepThinkingMode: boolean;
    searchBeforePlanning: boolean;
  },
  options: { abortSignal?: AbortSignal } = {},
) {
  return MessageService.sendMessage(message, params, options);
}
