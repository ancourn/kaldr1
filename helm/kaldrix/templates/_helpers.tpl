{{/*
Expand the name of the chart.
*/}}
{{- define "kaldrix.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "kaldrix.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "kaldrix.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "kaldrix.labels" -}}
helm.sh/chart: {{ include "kaldrix.chart" . }}
{{ include "kaldrix.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "kaldrix.selectorLabels" -}}
app.kubernetes.io/name: {{ include "kaldrix.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "kaldrix.serviceAccountName" -}}
{{- if .Values.monitoring.serviceAccount.create }}
{{- default (include "kaldrix.fullname" .) .Values.monitoring.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.monitoring.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Common annotations
*/}}
{{- define "kaldrix.annotations" -}}
{{- if .Values.commonAnnotations }}
{{- toYaml .Values.commonAnnotations }}
{{- end }}
{{- end }}

{{/*
Create a default database URL
*/}}
{{- define "kaldrix.databaseURL" -}}
{{- if .Values.postgresql.enabled }}
postgresql://{{ .Values.postgresql.global.postgresql.auth.username }}:$(DATABASE_PASSWORD)@{{ include "kaldrix.fullname" . }}-postgresql:5432/{{ .Values.postgresql.global.postgresql.auth.database }}
{{- else }}
postgresql://kaldrix:$(DATABASE_PASSWORD)@postgres-service:5432/kaldrix_prod
{{- end }}
{{- end }}

{{/*
Create a default Redis URL
*/}}
{{- define "kaldrix.redisURL" -}}
{{- if .Values.redis.enabled }}
redis://:$(REDIS_PASSWORD)@{{ include "kaldrix.fullname" . }}-redis-master:6379
{{- else }}
redis://:$(REDIS_PASSWORD)@redis-service:6379
{{- end }}
{{- end }}

{{/*
Create a default blockchain node URL
*/}}
{{- define "kaldrix.blockchainURL" -}}
http://blockchain-service:8545
{{- end }}

{{/*
Create image pull secret
*/}}
{{- define "kaldrix.imagePullSecrets" -}}
{{- range .Values.global.imagePullSecrets }}
- name: {{ . }}
{{- end }}
{{- end }}

{{/*
Create environment-specific labels
*/}}
{{- define "kaldrix.environmentLabels" -}}
environment: {{ .Values.global.environment }}
{{- if .Values.commonLabels }}
{{- toYaml .Values.commonLabels }}
{{- end }}
{{- end }}

{{/*
Create health check probes
*/}}
{{- define "kaldrix.healthChecks" -}}
{{- if .Values.healthChecks.enabled }}
{{- with .Values.healthChecks.livenessProbe }}
livenessProbe:
  httpGet:
    path: /api/health
    port: {{ .port }}
  initialDelaySeconds: {{ .initialDelaySeconds }}
  periodSeconds: {{ .periodSeconds }}
  timeoutSeconds: {{ .timeoutSeconds }}
  failureThreshold: {{ .failureThreshold }}
{{- end }}
{{- with .Values.healthChecks.readinessProbe }}
readinessProbe:
  httpGet:
    path: /api/health
    port: {{ .port }}
  initialDelaySeconds: {{ .initialDelaySeconds }}
  periodSeconds: {{ .periodSeconds }}
  timeoutSeconds: {{ .timeoutSeconds }}
  failureThreshold: {{ .failureThreshold }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create security context
*/}}
{{- define "kaldrix.securityContext" -}}
{{- if .Values.security.containerSecurityContext }}
securityContext:
  {{- toYaml .Values.security.containerSecurityContext | nindent 2 }}
{{- end }}
{{- end }}

{{/*
Create pod security context
*/}}
{{- define "kaldrix.podSecurityContext" -}}
{{- if .Values.security.podSecurityContext }}
securityContext:
  {{- toYaml .Values.security.podSecurityContext | nindent 2 }}
{{- end }}
{{- end }}

{{/*
Create resource requirements
*/}}
{{- define "kaldrix.resources" -}}
resources:
  {{- toYaml .Values.resources | nindent 2 }}
{{- end }}

{{/*
Create affinity rules
*/}}
{{- define "kaldrix.affinity" -}}
{{- if .Values.affinity }}
affinity:
  {{- toYaml .Values.affinity | nindent 2 }}
{{- end }}
{{- end }}

{{/*
Create node selector
*/}}
{{- define "kaldrix.nodeSelector" -}}
{{- if .Values.nodeSelector }}
nodeSelector:
  {{- toYaml .Values.nodeSelector | nindent 2 }}
{{- end }}
{{- end }}

{{/*
Create tolerations
*/}}
{{- define "kaldrix.tolerations" -}}
{{- if .Values.tolerations }}
tolerations:
  {{- toYaml .Values.tolerations | nindent 2 }}
{{- end }}
{{- end }}

{{/*
Create topology spread constraints
*/}}
{{- define "kaldrix.topologySpreadConstraints" -}}
{{- if .Values.topologySpreadConstraints }}
topologySpreadConstraints:
  {{- toYaml .Values.topologySpreadConstraints | nindent 2 }}
{{- end }}
{{- end }}