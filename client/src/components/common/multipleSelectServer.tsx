interface SelectProps<T> {
  label: string;
  menuItems: T[];
  name: string;
  defaultvalue: string | undefined;
  valueKey?: keyof T;
  displayKey?: keyof T;
}

type SelectItem = string | number;

export async function MultipleSelectComponentServer<T>({
  label,
  menuItems,
  name,
  valueKey,
  defaultvalue,
  displayKey,
}: SelectProps<T>) {
  return (
    <>
      <div className="mb-2 lg:ml-4 lg:first:ml-0 w-full">
        <label htmlFor={name} className="text-sm text-zinc-600 mb-2 ml-1">
          {label}
        </label>
        <div className="relative">
          <select
            id={name}
            name={name}
            defaultValue={defaultvalue}
            className="block w-full p-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ease-in-out"
          >
            <option value="">Selecione uma opção</option>
            {menuItems.map((item, index) => (
              <option
                key={index}
                value={(valueKey ? item[valueKey] : item) as SelectItem}
              >
                {
                  (displayKey
                    ? item[displayKey]
                    : item) as unknown as SelectItem
                }
              </option>
            ))}
          </select>
          <div className="absolute z-10 hidden w-full bg-white border border-gray-300 rounded-md shadow-md group-focus-within:block transition-all duration-300 opacity-0 transform scale-95 group-focus-within:opacity-100 group-focus-within:scale-100">
            <ul className="py-1">
              {menuItems.map((item, index) => (
                <li
                  key={index}
                  value={(valueKey ? item[valueKey] : item) as SelectItem}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {
                    (displayKey
                      ? item[displayKey]
                      : item) as unknown as SelectItem
                  }
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
