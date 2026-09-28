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

const { canvasEditor } = useSelect();
const loadLocalTemplate = () => {
  Modal.confirm({
    title: '加载本地模板',
    content: '当前画布内容将被替换，确定继续吗？',
    onOk: () => canvasEditor.loadJSON(xiaohongshuProducts),
  });
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
