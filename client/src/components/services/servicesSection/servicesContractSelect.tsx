import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { styled } from "@mui/material/styles";

type ListboxProps = React.ComponentProps<"ul">;

const StyledListbox = styled("ul")({
  margin: 0,
  padding: 0,
  listStyle: "none",
  maxHeight: 300,
  overflow: "auto",
  position: "relative",
});

export const ServicesContractSelect = React.forwardRef<
  HTMLUListElement,
  ListboxProps
>(function VirtualizedListbox(props, ref) {
  const { children, ...other } = props;

  const items = React.Children.toArray(children);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ITEM_SIZE = 160;

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ITEM_SIZE,
    overscan: 5,
  });

  return (
    <StyledListbox ref={ref} {...other}>
      <div
        ref={scrollRef}
        style={{
          height: Math.min(items.length * ITEM_SIZE, 300),
          maxHeight: 300,
          overflow: "auto",
          position: "relative",
        }}
      >
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((vr) => (
            <div
              key={vr.key}
              style={{
                position: "absolute",
                top: vr.start,
                left: 0,
                width: "100%",
              }}
            >
              {items[vr.index]}
            </div>
          ))}
        </div>
      </div>
    </StyledListbox>
  );
});
