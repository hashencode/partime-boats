import { Button, Card, Form, Space, theme } from 'antd'
import React from 'react'
import { PageHeaderWithBack } from '../../components/form-page-header'
import type { BasicCrudFormSpec } from '../specs/basic-crud-form-spec'
import { TemplateFormStateGate } from '../form/template-form-state-gate'

void React

export const BasicCrudFormRecipe = <TValues extends object>({ spec }: { spec: BasicCrudFormSpec<TValues> }) => {
  const { token } = theme.useToken()

  return (
    <TemplateFormStateGate
      parsedMode={spec.parsedMode}
      modeView={spec.modeView}
      permissionDenied={spec.permissionDenied}
      detailLoading={spec.detailLoading}
      detailError={spec.detailError}
      onBackToList={spec.onBackToList}
      onRetryDetail={spec.onRetryDetail}
    >
      <div className="space-y-4 pb-20">
        <PageHeaderWithBack title={spec.title} onBack={spec.onBackToList} />
        <Card>
          <Form<TValues>
            form={spec.form}
            layout="vertical"
            requiredMark={false}
            initialValues={spec.initialValues}
            className={`mx-auto mt-2 ${spec.maxWidthClassName ?? 'max-w-[620px]'}`}
            disabled={spec.isReadonly || spec.saveLoading}
            onFinish={spec.onSubmit}
          >
            {spec.stateCopy.readonlyNotice && spec.isReadonly ? (
              <div
                className="mb-4 rounded-lg border px-3 py-2 text-sm"
                style={{
                  borderColor: 'var(--status-info-border)',
                  background: 'var(--status-info-bg)',
                  color: 'var(--text-primary)',
                }}
              >
                {spec.stateCopy.readonlyNotice}
              </div>
            ) : null}

            {spec.renderFields()}
            {spec.renderAfterForm ?? null}

            {spec.modeView?.showActions ? (
              <div
                className="fixed right-0 bottom-0 left-0 z-[11] flex justify-center px-6 py-3 backdrop-blur-[6px] lg:left-56"
                style={{
                  borderTop: `1px solid ${token.colorBorderSecondary}`,
                  background: token.colorBgElevated,
                }}
              >
                <Space>
                  <Button type="primary" htmlType="submit" loading={spec.saveLoading}>
                    保存
                  </Button>
                  <Button htmlType="button" onClick={spec.onResetAll}>
                    重置
                  </Button>
                </Space>
              </div>
            ) : null}
          </Form>
        </Card>
      </div>
    </TemplateFormStateGate>
  )
}
