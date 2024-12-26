export function replaceFilterOptions(filter: { filter: { [key: string]: string | number } }): { [key: string]: string | number } {
	return filter.filter ? filter.filter : {};
}

export const toLowerCaseFields = <T extends Record<string, any>>(obj: T): T => {
	return Object.fromEntries(
		Object.entries(obj).map(([key, value]) => {
			return [
				key.toLowerCase(),
				value
			]
		})
	) as T;
}