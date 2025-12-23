<template>
    <view>
        <view v-for="(item, i) of data" :key="i" style="margin-bottom: 16px;">
            <view style="color: #303133; font-size: 24px;">{{ item[0] }}</view>
            <view v-for="(record, j) of item[1]" :key="j" style="margin-bottom: 4px;">
                <view style="padding-left: 16px;">
                    <text style="padding-right: 8px;">
                        <text v-if="record[0]" style="color: green;">✔</text>
                        <text v-else style="color: red;">✖</text>
                    </text>
                    <text style="color: #909399">{{ record[1] }}</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script lang="ts">
import Vue from 'vue';
import "../../mphttpx";
import { Notify } from  "../../mphttpx/utils";

export default Vue.extend({
    data() {
        return {
            data: [] as [string, [boolean, string][]][],
        };
    },

    mounted() {
        Notify.subscribe(v => { this.data = v; });
    },
});
</script>

<style>

</style>
