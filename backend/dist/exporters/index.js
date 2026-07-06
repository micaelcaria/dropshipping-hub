export function exportForMarketplace(product, marketplace) {
    const price = product.marketplace_prices?.[marketplace] ?? product.cost_price * 1.4;
    switch (marketplace) {
        case 'olx':
            return {
                Título: product.name.slice(0, 70),
                Descrição: buildDescription(product),
                Preço: price,
                Categoria: product.category || 'Outros',
                Estado: 'Novo',
                Marca: product.brand || '',
                Imagens: product.images.slice(0, 8).join(', '),
            };
        case 'vinted':
            return {
                Título: product.name.slice(0, 60),
                Descrição: buildDescription(product),
                Preço: price,
                Marca: product.brand || 'Sem marca',
                Estado: 'Novo com etiqueta',
                Categoria: mapVintedCategory(product.category),
                Imagens: product.images.slice(0, 20).join(', '),
            };
        case 'wallapop':
            return {
                Título: product.name.slice(0, 60),
                Descrição: buildDescription(product),
                Preço: price,
                Categoria: product.category || 'Outros',
                Estado: 'Novo',
                Imagens: product.images.slice(0, 10).join(', '),
            };
        case 'amazon':
            return {
                'item_name': product.name,
                'external_product_id': product.sku || product.supplier_ref || '',
                'external_product_id_type': 'EAN',
                'brand_name': product.brand || '',
                'item_type': product.category || '',
                'standard_price': price,
                'quantity': 99,
                'main_image_url': product.images[0] || '',
                'other_image_url1': product.images[1] || '',
                'other_image_url2': product.images[2] || '',
                'product_description': product.description || product.name,
                'bullet_point1': buildBulletPoints(product)[0] || '',
                'bullet_point2': buildBulletPoints(product)[1] || '',
                'bullet_point3': buildBulletPoints(product)[2] || '',
                'item_weight': product.weight_kg || '',
                'condition_type': 'New',
            };
        case 'fnac':
            return {
                'Referência': product.sku || product.supplier_ref || '',
                'Título': product.name,
                'Descrição': product.description || '',
                'Preço': price,
                'Marca': product.brand || '',
                'Categoria': product.category || '',
                'EAN': '',
                'Imagem principal': product.images[0] || '',
                'Stock': 99,
                'Estado': 'Novo',
            };
        case 'temu':
            return {
                'Product Name': product.name,
                'Product Description': product.description || '',
                'Price': price,
                'Category': product.category || '',
                'Brand': product.brand || '',
                'Main Image': product.images[0] || '',
                'Image 2': product.images[1] || '',
                'Image 3': product.images[2] || '',
                'Weight (kg)': product.weight_kg || '',
                'SKU': product.sku || product.supplier_ref || '',
                'Condition': 'New',
                'Stock': 99,
            };
        default:
            return { name: product.name, price };
    }
}
function buildDescription(product) {
    const lines = [product.description || product.name];
    if (product.brand)
        lines.push(`Marca: ${product.brand}`);
    if (product.weight_kg)
        lines.push(`Peso: ${product.weight_kg} kg`);
    if (product.attributes) {
        Object.entries(product.attributes).forEach(([k, v]) => lines.push(`${k}: ${v}`));
    }
    lines.push('\nProduto novo. Envio rápido.');
    return lines.join('\n');
}
function buildBulletPoints(product) {
    const points = [];
    if (product.brand)
        points.push(`Marca: ${product.brand}`);
    if (product.category)
        points.push(`Categoria: ${product.category}`);
    if (product.weight_kg)
        points.push(`Peso: ${product.weight_kg} kg`);
    if (product.attributes)
        Object.entries(product.attributes).slice(0, 2).forEach(([k, v]) => points.push(`${k}: ${v}`));
    points.push('Produto novo em embalagem original');
    return points;
}
function mapVintedCategory(category) {
    if (!category)
        return 'Outros';
    const c = category.toLowerCase();
    if (c.includes('roupa') || c.includes('cloth') || c.includes('wear'))
        return 'Roupa';
    if (c.includes('sapato') || c.includes('shoe') || c.includes('calçado'))
        return 'Calçado';
    if (c.includes('eletro') || c.includes('electr'))
        return 'Eletrónica';
    if (c.includes('casa') || c.includes('home'))
        return 'Casa';
    return 'Outros';
}
