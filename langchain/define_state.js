// src/agent/define_state.js
import { END } from "@langchain/langgraph";
import { Runnable } from "@langchain/core/runnables";
import { BaseMessage } from "@langchain/core/messages";

class AgentStateBuilder extends Runnable {
  constructor() {
    super();
    this.messages = [];
    this.next = null;
  }

  addMessage(message) {
    this.messages.push(message);
  }

  setNext(next) {
    this.next = next;
  }

  invoke(input) {
    return {
      messages: this.messages,
      next: this.next || END,
    };
  }
}

export { AgentStateBuilder, END };
