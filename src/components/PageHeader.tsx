type PageHeaderProps = {
  title: string;
  description?: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header>
      <h1 className="text-[1.375rem] font-bold leading-tight text-[#000000]">
        {title}
      </h1>
      {description && (
        <p className="mt-2 text-[0.8125rem] font-normal leading-relaxed text-[#222222]">
          {description}
        </p>
      )}
    </header>
  );
}
