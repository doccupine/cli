export const columnsTemplate = `"use client";
import styled from "styled-components";
import { mq, Theme } from "cherry-styled-components";

const StyledColumns = styled.div<{ theme: Theme; $columns?: number }>\`
  display: flex;
  flex-direction: column;
  gap: 20px;

  \${mq("lg")} {
    display: grid;
    grid-template-columns: repeat(\${({ $columns }) => $columns ?? 1}, 1fr);
  }
\`;

interface ColumnsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  cols?: number;
}

function Columns({ children, cols }: ColumnsProps) {
  return <StyledColumns $columns={cols}>{children}</StyledColumns>;
}

export { Columns };
`;
