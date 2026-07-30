export const spaceTemplate = `"use client";
import { Space as CherrySpace } from "cherry-styled-components";

type SpaceSize = number | "none";

interface SpaceProps {
  size?: SpaceSize;
  xs?: SpaceSize;
  sm?: SpaceSize;
  md?: SpaceSize;
  lg?: SpaceSize;
  xl?: SpaceSize;
  xxl?: SpaceSize;
  xxxl?: SpaceSize;
  horizontal?: boolean;
  // Cherry marks its styling props transient with a $ prefix, which is an
  // implementation detail of styled-components rather than something an MDX
  // author should have to know - every other Doccupine component takes plain
  // names. Space was previously re-exported straight from Cherry, so pages
  // written against that API still pass the $ form: it stays accepted here,
  // with the documented plain name winning when both are present, so an
  // upgrade never silently drops a gap from an existing page.
  $size?: SpaceSize;
  $xs?: SpaceSize;
  $sm?: SpaceSize;
  $md?: SpaceSize;
  $lg?: SpaceSize;
  $xl?: SpaceSize;
  $xxl?: SpaceSize;
  $xxxl?: SpaceSize;
  $horizontal?: boolean;
}

function Space({
  size,
  xs,
  sm,
  md,
  lg,
  xl,
  xxl,
  xxxl,
  horizontal,
  $size,
  $xs,
  $sm,
  $md,
  $lg,
  $xl,
  $xxl,
  $xxxl,
  $horizontal,
}: SpaceProps) {
  return (
    <CherrySpace
      $size={size ?? $size}
      $xs={xs ?? $xs}
      $sm={sm ?? $sm}
      $md={md ?? $md}
      $lg={lg ?? $lg}
      $xl={xl ?? $xl}
      $xxl={xxl ?? $xxl}
      $xxxl={xxxl ?? $xxxl}
      $horizontal={horizontal ?? $horizontal}
    />
  );
}

export { Space };
`;
