import React from "react";
import { useNode } from "@craftjs/core";
import { Textarea } from "@headlessui/react"; // Using a more modern component
import { debounce }from "lodash";

export const Text = ({ text, ...props }) => {
  const {
    connectors: { connect, drag },
    actions: { setProp },
  } = useNode();

  const debouncedSetProp = debounce(setProp, 500);

  return (
    <Textarea
      {...props}
      ref={(ref) => connect(drag(ref))}
      value={text}
      onChange={(e) => debouncedSetProp((props) => (props.text = e.target.value))}
      className="w-full p-2 rounded-md border-transparent focus:border-blue-500 focus:ring-blue-500 transition-all"
    />
  );
};

const TextSettings = () => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props,
  }));

  return (
    <div className="p-4 space-y-4">
      <div>
        <label htmlFor="text-content" className="block text-sm font-medium text-gray-700">
          Text Content
        </label>
        <Textarea
          id="text-content"
          value={props.text}
          onChange={(e) => setProp((props) => (props.text = e.target.value), 500)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          rows={5}
        />
      </div>
    </div>
  );
};

Text.craft = {
  props: {
    text: "Hi",
  },
  related: {
    settings: TextSettings,
  },
  displayName: "Text",
};