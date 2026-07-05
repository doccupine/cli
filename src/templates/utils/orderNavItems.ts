export const orderNavItemsTemplate = `export interface PagesProps {
  slug: string;
  title: string;
  date: string | null;
  category: string;
  description?: string;
  path?: string;
  categoryOrder?: number;
  order?: number;
  section?: string;
  navIcon?: string;
  categoryIcon?: string;
}

interface AccProps {
  [key: string]: {
    categoryOrder: number;
    icon?: string;
    pages: {
      date: string | null;
      slug: string;
      title: string;
      order: number;
      icon?: string;
    }[];
  };
}

function transformPagesToGroupedStructure(pages: PagesProps[]) {
  const grouped = pages.reduce((acc: AccProps, page: PagesProps) => {
    const category = page.category || "Uncategorized";

    if (!acc[category]) {
      acc[category] = {
        categoryOrder: page.categoryOrder || 0,
        pages: [],
      };
    }

    // The first page in a category to declare a categoryIcon sets it.
    if (!acc[category].icon && page.categoryIcon) {
      acc[category].icon = page.categoryIcon;
    }

    acc[category].pages.push({
      date: page.date,
      slug: page.slug,
      title: page.title,
      order: page.order || 0,
      icon: page.navIcon,
    });

    return acc;
  }, {});

  return Object.entries(grouped)
    .sort(([, a], [, b]) => a.categoryOrder - b.categoryOrder)
    .map(([categoryName, categoryData], index) => ({
      slug: index === 0 ? "" : categoryName.toLowerCase().replace(/s+/g, "-"),
      label: categoryName,
      icon: categoryData.icon,
      links: categoryData.pages.sort((a, b) => a.order - b.order),
    }));
}

export { transformPagesToGroupedStructure };
`;
