function schemaTypes(schema) {
    if (!schema.type)
        return [];
    return Array.isArray(schema.type) ? schema.type : [schema.type];
}
function typeLabel(schema) {
    const types = schemaTypes(schema);
    return types.length > 0 ? types.join("|") : "any";
}
function shapeMatchesType(shape, type) {
    switch (type) {
        case "null":
            return shape.kind === "null";
        case "boolean":
            return shape.kind === "boolean";
        case "string":
            return shape.kind === "string";
        case "number":
        case "integer":
            // Shapes are value-free: an observed number satisfies integer.
            return shape.kind === "number";
        case "array":
            return shape.kind === "array";
        case "object":
            return shape.kind === "object";
        default:
            return false;
    }
}
/** Compare an observed Shape to a declared schema. Empty array = compatible. */
export function compareShapeToSchema(shape, schema, path = "$") {
    const findings = [];
    const types = schemaTypes(schema);
    if (types.length > 0 && !types.some((t) => shapeMatchesType(shape, t))) {
        findings.push({ kind: "type-mismatch", path, expected: typeLabel(schema), observed: shape.kind });
        return findings; // shape is the wrong kind - deeper comparison is meaningless
    }
    if (shape.kind === "object" && (types.includes("object") || schema.properties)) {
        const properties = schema.properties ?? {};
        const required = new Set(schema.required ?? []);
        for (const name of required) {
            if (!(name in shape.fields)) {
                findings.push({
                    kind: "missing-required-field",
                    path: `${path}.${name}`,
                    ...(properties[name] ? { expected: typeLabel(properties[name]) } : {}),
                });
            }
        }
        for (const [name, fieldShape] of Object.entries(shape.fields)) {
            const propSchema = properties[name];
            if (!propSchema) {
                findings.push({
                    kind: "unexpected-field",
                    path: `${path}.${name}`,
                    observed: fieldShape.kind,
                });
                continue;
            }
            findings.push(...compareShapeToSchema(fieldShape, propSchema, `${path}.${name}`));
        }
    }
    if (shape.kind === "array" && schema.items) {
        for (const itemShape of shape.items) {
            findings.push(...compareShapeToSchema(itemShape, schema.items, `${path}[]`));
        }
    }
    return findings;
}
//# sourceMappingURL=schema-compat.js.map