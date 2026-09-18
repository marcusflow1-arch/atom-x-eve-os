export const CREATOR_PARENTING_PREVIEW = {
  id: 'creator-parenting-preview',
  release: 'admin-preview',
  enabledForRoles: ['admin'],
  parentGender: 'any',
  children: [
    {
      id: 'creator-daughter-1',
      relationship: 'daughter',
      displayName: 'Daughter',
      gender: 'female',
      modelSearch: [
        'greco roman child girl',
        'greco-roman child girl',
        'stylized 3d greco roman child girl',
        'child girl character',
      ],
      fallbackModelUrl: '/models/atomxe-greco-girl.glb',
      animation: 'idle',
      idleOnly: true,
    },
  ],
};

export function canUseCreatorParentingPreview(user) {
  return CREATOR_PARENTING_PREVIEW.enabledForRoles.includes(String(user?.role || '').toLowerCase());
}

function searchableModelText(model) {
  const tags = Array.isArray(model?.tags) ? model.tags.join(' ') : model?.tags;
  return [
    model?.name,
    model?.description,
    model?.category,
    tags,
    model?.file_url,
  ].filter(Boolean).join(' ').toLowerCase();
}

export function findCreatorChildModel(models = [], child = CREATOR_PARENTING_PREVIEW.children[0]) {
  if (!Array.isArray(models) || !child) return null;

  const scored = models
    .map((model) => {
      const haystack = searchableModelText(model);
      let score = 0;

      child.modelSearch.forEach((needle, index) => {
        if (haystack.includes(needle)) score += 100 - (index * 8);
      });

      if (/greco[- ]?roman/.test(haystack)) score += 36;
      if (/child/.test(haystack)) score += 34;
      if (/girl/.test(haystack)) score += 34;
      if (/stylized/.test(haystack)) score += 8;
      if (/allparts/.test(haystack)) score += 6;

      return { model, score };
    })
    .filter(({ model, score }) => score > 0 && model?.file_url)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.model || null;
}
