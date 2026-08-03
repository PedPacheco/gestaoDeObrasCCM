import React, { useRef } from "react";

import { styled } from "@mui/material/styles";
import { useVirtualizer } from "@tanstack/react-virtual";

type ListboxProps = React.ComponentProps<"ul">;

const StyledListbox = styled("ul")({
  margin: 0,
  padding: "8px 0",
  listStyle: "none",
  maxHeight: 460,
  overflow: "hidden",
  position: "relative",
  backgroundColor: "#fff",
});

export const ServicesContractSelect = React.forwardRef<
  HTMLUListElement,
  ListboxProps
>(function VirtualizedListbox(props, ref) {
  const { children, ...other } = props;

  const items = React.Children.toArray(children);
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 150, // estimativa inicial (não precisa ser exata)
    overscan: 5,
  });

  return (
    <StyledListbox
      ref={ref}
      {...other}
      style={{ ...other.style, overflow: "hidden", maxHeight: 460 }}
    >
      <div
        ref={scrollRef}
        style={{
          height: "100%",
          maxHeight: 460,
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
              data-index={vr.index}
              ref={virtualizer.measureElement}
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
