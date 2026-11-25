export const columnsTemplate = `interface ColumnsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  cols?: number;
}

function Columns({ children, cols }: ColumnsProps) {
  return (
    <div
      className="dcp-columns"
      data-wide={cols && cols >= 3 ? "" : undefined}
      style={
        cols ? ({ "--dcp-columns": cols } as React.CSSProperties) : undefined
      }
    >
      {children}
    </div>
  );
}

export { Columns };
`;
