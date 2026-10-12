// Tools the support agent can call. Definitions follow the Claude API tool format:
// a name, a description Claude reads to decide when to use the tool, and a JSON Schema
// for the input. This file already works; your tasks are in agent.js.

const ORDERS = {
  A100: { id: 'A100', status: 'shipped', carrier: 'UPS', eta: '2026-10-15' },
  B200: { id: 'B200', status: 'processing', carrier: null, eta: null }
};

export const toolDefinitions = [
  {
    name: 'lookup_order',
    description:
      'Look up the status of a customer order by its order ID. Returns status, carrier, and delivery estimate.',
    input_schema: {
      type: 'object',
      properties: {
        order_id: { type: 'string', description: 'The order ID, for example "A100".' }
      },
      required: ['order_id']
    }
  },
  {
    name: 'cancel_order',
    description: 'Cancel an order. Only orders that have not shipped can be cancelled.',
    input_schema: {
      type: 'object',
      properties: {
        order_id: { type: 'string', description: 'The order ID to cancel.' }
      },
      required: ['order_id']
    }
  }
];

// Runs one tool. Throws on unknown tools or bad requests; the agent decides how to report that.
export function executeTool(name, input) {
  switch (name) {
    case 'lookup_order': {
      const order = ORDERS[input.order_id];
      if (!order) throw new Error(`Order ${input.order_id} not found.`);
      return order;
    }
    case 'cancel_order': {
      const order = ORDERS[input.order_id];
      if (!order) throw new Error(`Order ${input.order_id} not found.`);
      if (order.status !== 'processing') {
        throw new Error(`Order ${input.order_id} has already ${order.status} and cannot be cancelled.`);
      }
      return { id: order.id, status: 'cancelled' };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
