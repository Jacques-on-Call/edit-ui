import React from "react";
import { useNode } from "@craftjs/core";

export const Text = ({ text }) => {
  const { connectors: { connect, drag } } = useNode();
  return (
    <div ref={ref => connect(drag(ref))}>
      <p className="m-0">{text}</p>
    </div>
  );
};

const TextSettings = () => {
  // Settings controls can be added here in the future.
  return (
    <div className="p-4">
      <p className="text-sm text-gray-500">No settings available for this component yet.</p>
    </div>
  );
};

Text.craft = {
  props: {
    text: "Default Text",
  },
  related: {
    settings: TextSettings,
  },
  displayName: "Text Block",
};