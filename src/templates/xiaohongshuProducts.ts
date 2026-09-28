// A self-contained Fabric document. SVG data URLs keep the five placeholders local.
const plush = (body: string, accent: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="340" viewBox="0 0 300 340"><ellipse cx="150" cy="315" rx="100" ry="15" fill="#d9c9c1"/><ellipse cx="82" cy="90" rx="40" ry="49" fill="${body}"/><ellipse cx="218" cy="90" rx="40" ry="49" fill="${body}"/><ellipse cx="150" cy="195" rx="112" ry="117" fill="${body}"/><ellipse cx="150" cy="208" rx="75" ry="77" fill="${accent}"/><circle cx="119" cy="165" r="8" fill="#3a302e"/><circle cx="181" cy="165" r="8" fill="#3a302e"/><ellipse cx="150" cy="190" rx="12" ry="9" fill="#6b4b46"/><path d="M140 207 Q150 218 160 207" fill="none" stroke="#6b4b46" stroke-width="5" stroke-linecap="round"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const text = (id: string, value: string, left: number, top: number, fontSize: number, width: number, extra = {}) => ({
  type: 'textbox', id, text: value, left, top, width, fontSize,
  fontFamily: 'sans-serif', fill: '#47332f', editable: true, ...extra,
});

const products = [
  ['product-1', 85, 695, '#cda7a0', '#f5d8cc'],
  ['product-2', 390, 695, '#d9bd8d', '#f8e7c1'],
  ['product-3', 695, 695, '#a8bba9', '#dce8ce'],
  ['product-4', 245, 1050, '#a9b7ce', '#e0e5f1'],
  ['product-5', 555, 1050, '#d0acc2', '#f1dce8'],
].map(([id, left, top, body, accent]) => ({
  type: 'image', id, left, top, width: 300, height: 340,
  scaleX: 1, scaleY: 1, src: plush(body as string, accent as string),
}));

export const xiaohongshuProducts = {
  version: '5.3.0',
  objects: [
    { type: 'rect', id: 'workspace', left: 0, top: 0, width: 1080, height: 1440, fill: '#fff8f3', strokeWidth: 0, selectable: false, evented: false },
    text('headline', '毛绒玩偶定制周边', 80, 72, 72, 920, { fontWeight: 'bold', textAlign: 'center' }),
    text('moq', '300个起订', 390, 180, 38, 300, { textAlign: 'center', fill: '#a65e57' }),
    ...[
      ['tag-1', '企业周边'], ['tag-2', '活动赠礼'],
      ['tag-3', '品牌周边'], ['tag-4', '多场景定制'],
    ].map(([id, value], i) => text(id, value, 70 + i * 250, 318, 30, 220, { textAlign: 'center' })),
    ...[
      ['stat-1', '行业经验 10年+'], ['stat-2', '工厂面积 3w+㎡'], ['stat-3', '员工人数 500+'],
    ].map(([id, value], i) => text(id, value, 45 + i * 350, 485, 32, 310, { textAlign: 'center', fontWeight: 'bold' })),
    ...products,
  ],
};
