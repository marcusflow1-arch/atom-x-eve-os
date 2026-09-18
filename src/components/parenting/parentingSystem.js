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
        'hi3d_stylized 3d greco-roman child girl character',
        'greco-roman child girl character',
        'greco roman child girl character',
        'child girl character_allparts',
      ],
      expectedFileSize: 146627668,
      fallbackModelUrl: null,
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
      const exactRomanChild = /greco[- ]?roman child girl character/.test(haystack)
        || /hi3d[_ ]stylized 3d greco[- ]?roman child girl character/.test(haystack);
      let score = exactRomanChild ? 1000 : 0;

      child.modelSearch.forEach((needle, index) => {
        if (haystack.includes(needle)) score += 140 - (index * 10);
      });

      if (/greco[- ]?roman/.test(haystack)) score += 70;
      if (/child/.test(haystack)) score += 65;
      if (/girl/.test(haystack)) score += 65;
      if (/character/.test(haystack)) score += 25;
      if (/stylized/.test(haystack)) score += 14;
      if (/allparts/.test(haystack)) score += 12;
      if (Number(model?.file_size || 0) === Number(child.expectedFileSize || 0)) score += 180;

      // Do not allow the adult/general Greco model to win this lookup.
      if (/atomxe-greco-girl/.test(haystack) && !/child/.test(haystack)) score = -1;

      return { model, score, exactRomanChild };
    })
    .filter(({ model, score, exactRomanChild }) => exactRomanChild && score > 0 && model?.file_url)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.model || null;
}
