"use client";

import {
  Box,
  Button,
  Grid,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

export default function ServicosPage() {
  return (
    <Box p={3}>
      {/* Cabeçalho */}
      <Grid container justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          SERVIÇOS
        </Typography>
        <Grid item>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <TextField type="date" size="small" />
            </Grid>
            <Grid item>
              <Button variant="contained" color="error">
                Excluir Serviços
              </Button>
            </Grid>
            <Grid item>
              <Button variant="contained" color="primary">
                Importar Serviços
              </Button>
            </Grid>
            <Grid item>
              <Button variant="contained" color="inherit">
                Cancelar Programação
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Área principal */}
      <Grid container spacing={3}>
        {/* Serviços disponíveis */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Serviços Disponíveis para Programação
            </Typography>

            {/* Filtros */}
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} md={3}>
                <Select fullWidth size="small" defaultValue="">
                  <MenuItem value="">Serviço</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={12} md={3}>
                <Select fullWidth size="small" defaultValue="">
                  <MenuItem value="">Operação</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={12} md={3}>
                <Select fullWidth size="small" defaultValue="">
                  <MenuItem value="">Ponto</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={12} md={3}>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Button variant="contained" color="primary" fullWidth>
                      Aplicar
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button variant="contained" color="inherit" fullWidth>
                      Limpar
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            {/* Tabela de serviços */}
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Obra</TableCell>
                    <TableCell>Código</TableCell>
                    <TableCell>Serviço</TableCell>
                    <TableCell>Operação</TableCell>
                    <TableCell>Ponto</TableCell>
                    <TableCell>Data Prog</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Prog</TableCell>
                    <TableCell>Real</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>4001814253</TableCell>
                    <TableCell>71009797</TableCell>
                    <TableCell>SERV I-POSTE</TableCell>
                    <TableCell>Instalação</TableCell>
                    <TableCell>P1</TableCell>
                    <TableCell>19/09/2025</TableCell>
                    <TableCell>1,00</TableCell>
                    <TableCell>0,00</TableCell>
                    <TableCell>711,15</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Button
              variant="contained"
              color="success"
              fullWidth
              sx={{ mt: 2 }}
            >
              Programar Serviços
            </Button>
          </Paper>
        </Grid>

        {/* Histórico */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Histórico das Programações
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Serviço</TableCell>
                    <TableCell>Operação</TableCell>
                    <TableCell>Ponto</TableCell>
                    <TableCell>Data Prog</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Prog</TableCell>
                    <TableCell>Real</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Nenhum histórico encontrado
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Serviços programados + adicionar serviços */}
      <Grid container spacing={3} mt={1}>
        {/* Serviços programados */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Serviços Programados
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Obra</TableCell>
                    <TableCell>Código</TableCell>
                    <TableCell>Serviço</TableCell>
                    <TableCell>Operação</TableCell>
                    <TableCell>Ponto</TableCell>
                    <TableCell>Data Prog</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Nenhum serviço programado
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Grid container spacing={2} mt={2}>
              <Grid item xs={6}>
                <Button variant="contained" color="success" fullWidth>
                  Realizar Serviço
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button variant="contained" color="warning" fullWidth>
                  Reprogramar Serviços
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Adicionar serviço */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Adicionar Serviços
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Select fullWidth size="small" defaultValue="">
                  <MenuItem value="">Selecionar Serviço</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth size="small" label="Código Material" />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth size="small" label="Ponto" />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth size="small" label="Operação" />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Qtd Plan"
                  type="number"
                />
              </Grid>
            </Grid>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
            >
              Adicionar Serviço
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
