export const fieldTemplate = `interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  value: string;
  type: string;
  required?: boolean;
}

function Field({ children, value, type, required }: FieldProps) {
  return (
    <div className="dcp-field">
      <div className="dcp-field__meta">
        <span className="dcp-field__value">{value}</span>
        <span className="dcp-field__type">{type}</span>
        {required && <span className="dcp-field__required">required</span>}
      </div>
      {children}
    </div>
  );
}

export { Field };
`;
