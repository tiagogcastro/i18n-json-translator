import { UnflattenJSONRequest } from '@/types';

export const flattenJSON = (obj: any, prefix = ""): Record<string, string> => {
  let result: Record<string, string> = {};

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flattenJSON(value, newKey));
    } else {
      result[newKey] = value;
    }
  }

  return result;
};

export const unflattenJSON = ({
  flat,
  original,
}: UnflattenJSONRequest): any => {
  const result: any = original ? { ...original } : {};

  for (const fullKey in flat) {
    const keys = fullKey.split(".");
    let acc = result;

    for (let i = 0; i < keys.length; i++) {
      const part = keys[i];
      const isLast = i === keys.length - 1;

      if (isLast) {
        acc[part] = flat[fullKey];
      } else {
        if (!acc[part] || typeof acc[part] !== "object") {
          acc[part] = {};
        }
        acc = acc[part];
      }
    }
  }

  return result;
};