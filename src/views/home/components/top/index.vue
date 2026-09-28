<template>
  <Header>
    <div class="left">
      <logo></logo>
      <Divider type="vertical" />

      <!-- 导入 -->
      <import-Json></import-Json>
      <Divider type="vertical" />
      <import-file></import-file>
      <Divider type="vertical" />
      <Button type="text" to="/template" target="_blank">全部模板</Button>
      <Button type="text" @click="loadLocalTemplate">小红书多产品模板</Button>
      <Button type="text" @click="fillProductImages">批量填充产品图</Button>
      <Divider type="vertical" />

      <myTemplName></myTemplName>
      <!-- 标尺开关 -->
      <Tooltip :content="$t('grid')">
        <iSwitch v-model="toggleModel" size="small" class="switch"></iSwitch>
      </Tooltip>
      <Divider type="vertical" />
      <history></history>
    </div>

    <div class="right">
      <a href="https://pro.kuaitu.cc/" target="_blank" alt="商业版">
        <img width="15" :src="proIcon" alt="vue-fbric-editor" />
      </a>
      <!-- 管理员模式 -->
      <admin />
      <!-- 预览 -->
      <previewCurrent />
      <waterMark />
      <save></save>
      <login></login>
      <lang></lang>
    </div>
  </Header>
</template>

<script name="Top" setup lang="ts">
import proIcon from '@/assets/icon/proIcon.png';
// 导入元素
import importJson from '@/components/importJSON.vue';
import importFile from '@/components/importFile.vue';

// 顶部组件
import logo from '@/components/logo.vue';
import myTemplName from '@/components/myTemplName.vue';
import previewCurrent from '@/components/previewCurrent';
import save from '@/components/save.vue';
import lang from '@/components/lang.vue';
import waterMark from '@/components/waterMark.vue';
import login from '@/components/login';
import admin from '@/components/admin';
import history from '@/components/history.vue';
import useSelect from '@/hooks/select';
import { xiaohongshuProducts } from '@/templates/xiaohongshuProducts';
import { Modal } from 'view-ui-plus';
import { Utils } from '@kuaitu/core';
import { fabric } from 'fabric';

const { canvasEditor } = useSelect();
const { getImgStr, selectFiles, insertImgFile } = Utils;
const loadLocalTemplate = () => {
  Modal.confirm({
    title: '加载本地模板',
    content: '当前画布内容将被替换，确定继续吗？',
    onOk: () => canvasEditor.loadJSON(xiaohongshuProducts),
  });
};

const fillProductImages = async () => {
  const canvas = (canvasEditor as unknown as { canvas: fabric.Canvas }).canvas;
  const objects = canvas.getObjects();
  const products = [1, 2, 3, 4, 5].map((number) =>
    objects.find((item) => item.id === `product-${number}`)
  );
  if (!products[0]) {
    Modal.info({ title: '批量填充产品图', content: '请先加载小红书多产品模板。' });
    return;
  }

  const files = await selectFiles({ accept: 'image/*', multiple: true });
  if (!files?.length) return;

  try {
    for (const [index, file] of Array.from(files).slice(0, 5).entries()) {
      const product = products[index] as fabric.Image | undefined;
      if (!product || product.type !== 'image') continue;

      const fileStr = await getImgStr(file);
      const imgEl = (await insertImgFile(fileStr as string)) as HTMLImageElement;
      const width = product.getScaledWidth();
      const height = product.getScaledHeight();
      const center = product.getCenterPoint();

      await new Promise<void>((resolve) => {
        product.setSrc(imgEl.src, () => {
          const scale = Math.min(width / imgEl.naturalWidth, height / imgEl.naturalHeight);
          product.set({ scaleX: scale, scaleY: scale });
          product.set('originSrc', imgEl.src);
          product.setPositionByOrigin(center, 'center', 'center');
          product.setCoords();
          canvas.renderAll();
          resolve();
        });
      });
      imgEl.remove();
    }
    canvasEditor.saveState();
  } catch (error) {
    console.error('批量填充产品图失败', error);
    Modal.error({ title: '批量填充产品图', content: '图片读取失败，请检查所选文件。' });
  }
};

const props = defineProps(['ruler']);
const emit = defineEmits(['update:ruler']);

const toggleModel = computed({
  get() {
    return props.ruler;
  },
  set(value) {
    emit('update:ruler', value);
  },
});
</script>

<style lang="less" scoped>
.left,
.right {
  display: flex;
  align-items: center;
  img {
    display: block;
    margin-right: 10px;
  }
}
</style>
